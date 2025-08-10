import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

import Button from '@/components/Button/index';
import Card from '@/components/Card/index';
import Content from '@/components/Content/index';
import Meta from '@/components/Meta/index';
import { useInvitations, useWorkspaces } from '@/hooks/data/index';
import { AccountLayout } from '@/layouts/index';
import api from '@/lib/common/api';
import { useWorkspace } from '@/providers/workspace';
import { useTranslation } from "react-i18next";

const Welcome = () => {
  const router = useRouter();
  const { data: invitationsData, isLoading: isFetchingInvitations } =
    useInvitations();
  const { data: workspacesData, isLoading: isFetchingWorkspaces } =
    useWorkspaces();
  const { setWorkspace } = useWorkspace();
  const { t } = useTranslation();
  const [isSubmitting, setSubmittingState] = useState(false);
  const [weatherStatus, setWeatherStatus] = useState(null);

  // Fetch weather status for preview
  useEffect(() => {
    const fetchWeatherStatus = async () => {
      try {
        const response = await fetch('/api/weather/status');
        const result = await response.json();
        if (result.success) {
          setWeatherStatus(result.data);
        }
      } catch (error) {
        console.error('Error fetching weather status:', error);
      }
    };

    fetchWeatherStatus();
  }, []);

  const accept = (memberId) => {
    setSubmittingState(true);
    api(`/api/workspace/team/accept`, {
      body: { memberId },
      method: 'PUT',
    }).then((response) => {
      setSubmittingState(false);

      if (response.errors) {
        Object.keys(response.errors).forEach((error) =>
          toast.error(response.errors[error].msg)
        );
      } else {
        toast.success('Accepted invitation!');
      }
    });
  };

  const decline = (memberId) => {
    setSubmittingState(true);
    api(`/api/workspace/team/decline`, {
      body: { memberId },
      method: 'PUT',
    }).then((response) => {
      setSubmittingState(false);

      if (response.errors) {
        Object.keys(response.errors).forEach((error) =>
          toast.error(response.errors[error].msg)
        );
      } else {
        toast.success('Declined invitation!');
      }
    });
  };

  const navigate = (workspace) => {
    setWorkspace(workspace);
    router.replace(`/account/${workspace.slug}`);
  };

  return (
    <AccountLayout>
      <Meta title="Nextacular - Dashboard" />
      <Content.Title
        title={t('workspace.dashboard.header.title')}
        subtitle={t("workspace.dashboard.header.description")}
      />
      <Content.Divider />
      <Content.Container>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {isFetchingWorkspaces ? (
            <Card>
              <Card.Body />
              <Card.Footer />
            </Card>
          ) : workspacesData?.workspaces.length > 0 ? (
            workspacesData.workspaces.map((workspace, index) => (
              <Card key={index}>
                <Card.Body title={workspace.name} />
                <Card.Footer>
                  <button
                    className="text-blue-600"
                    onClick={() => navigate(workspace)}
                  >
                    Select workspace &rarr;
                  </button>
                </Card.Footer>
              </Card>
            ))
          ) : (
            <Card.Empty>{t('workspace.message.createworkspace')}</Card.Empty>
          )}
        </div>
      </Content.Container>
      
      {/* Weather Preview Section */}
      <Content.Divider thick />
      <Content.Title
        title="PAGASA Weather Parser"
        subtitle="Real-time tropical cyclone bulletin parsing and analysis"
      />
      <Content.Divider />
      <Content.Container>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <Card.Body 
              title="Parser Status" 
              subtitle={weatherStatus ? weatherStatus.systemHealth.parserStatus : 'Loading...'}
            />
            <Card.Footer>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                weatherStatus?.systemHealth?.parserStatus === 'Operational' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {weatherStatus ? weatherStatus.systemHealth.parserStatus : '...'}
              </span>
            </Card.Footer>
          </Card>

          <Card>
            <Card.Body 
              title="Active Cyclones" 
              subtitle={weatherStatus ? `${weatherStatus.activeCyclones.length} active` : 'Loading...'}
            />
            <Card.Footer>
              <span className="text-blue-600 text-sm">
                {weatherStatus ? `${weatherStatus.totalAreasAffected} areas affected` : '...'}
              </span>
            </Card.Footer>
          </Card>

          <Card>
            <Card.Body 
              title="Parse Stats" 
              subtitle={weatherStatus ? `${weatherStatus.parserStats.successfulParses} successful` : 'Loading...'}
            />
            <Card.Footer>
              <span className="text-green-600 text-sm">
                {weatherStatus ? `${weatherStatus.parserStats.averageParseTime} avg time` : '...'}
              </span>
            </Card.Footer>
          </Card>

          <Card>
            <Card.Body 
              title="Weather Parser" 
              subtitle="Parse PAGASA bulletins"
            />
            <Card.Footer>
              <button
                className="text-blue-600 hover:text-blue-800"
                onClick={() => router.push('/weather')}
              >
                Open Parser &rarr;
              </button>
            </Card.Footer>
          </Card>
        </div>
      </Content.Container>

      <Content.Divider thick />
      <Content.Title
        title={t("workspace.dashboard.header.invitations.title")}
        subtitle={t("workspace.dashboard.header.invitations.description")}
      />
      <Content.Divider />
      <Content.Container>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {isFetchingInvitations ? (
            <Card>
              <Card.Body />
              <Card.Footer />
            </Card>
          ) : invitationsData?.invitations.length > 0 ? (
            invitationsData.invitations.map((invitation, index) => (
              <Card key={index}>
                <Card.Body
                  title={invitation.workspace.name}
                  subtitle={`You have been invited by ${invitation.invitedBy.name || invitation.invitedBy.email
                    }`}
                />
                <Card.Footer>
                  <Button
                    className="text-white bg-blue-600 hover:bg-blue-500"
                    disabled={isSubmitting}
                    onClick={() => accept(invitation.id)}
                  >
                    Accept
                  </Button>
                  <Button
                    className="text-red-600 border border-red-600 hover:bg-red-600 hover:text-white"
                    disabled={isSubmitting}
                    onClick={() => decline(invitation.id)}
                  >
                    Decline
                  </Button>
                </Card.Footer>
              </Card>
            ))
          ) : (
            <Card.Empty>
              {t("workspace.team.invitations.empty.message")}
            </Card.Empty>
          )}
        </div>
      </Content.Container>
    </AccountLayout>
  );
};

export default Welcome;
